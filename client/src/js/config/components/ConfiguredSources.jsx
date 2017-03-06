import React, { Component, PropTypes } from "react";
import R from "ramda"; //eslint-disable-line id-length
import { searchInConfiguredSources, deleteSource } from "../../sourceConfig/actions/SourceConfigurationActions";
import { connect } from "react-redux";
import Input from "./../../utils/components/Input";
import SourceFilters from "./../../newsboard/filter/SourceFilters";

class ConfiguredSources extends Component {

    constructor() {
        super();
        this._renderSources = this._renderSources.bind(this);
    }

    componentDidMount() {
        this.props.dispatch(searchInConfiguredSources(""));
    }

    _renderSources(sourceType, searchKey) {
        const configuredSourceDOM = source =>
            <li className="source-name" key={source._id}>{source.name}
                <button className="delete-source" title={`Delete ${source.name}`} onClick={(event) => {
                    this.props.dispatch(deleteSource(source._id, sourceType, event));
                }}
                >&times;</button>
            </li>;

        if(searchKey) {
            const key = searchKey.toUpperCase();
            const configuredSources = source => source.name.toUpperCase().match(key) && source;
            return R.pipe(
                R.filter(configuredSources),
                R.map(configuredSourceDOM)
            )(this.props.sources[sourceType]);
        }

        const filterHashtags = source => !source.hashtag;
        return R.map(configuredSourceDOM, R.filter(filterHashtags, this.props.sources[sourceType]));
    }

    _searchInSources(event) {
        let value = event.target.value;
        this.props.dispatch(searchInConfiguredSources(value));
    }

    render() {
        return (
            <aside className="configured-sources-container">
                <h3 className="heading">My Sources</h3>
                <SourceFilters searchKeyword={this.props.searchKeyword} currentTab={this.props.currentTab} renderSources={this._renderSources}/>
                <Input className={"input-box"} eventHandlers={{ "onKeyUp": (event) => {
                    this._searchInSources(event);
                } }} placeholder="search" addonSrc="./images/search-icon.png"
                />
            </aside>
        );
    }
}

function mapToStore(state) {
    return {
        "sources": state.configuredSources,
        "searchKeyword": state.searchInConfiguredSources,
        "currentTab": state.currentSourceTab
    };
}

ConfiguredSources.propTypes = {
    "sources": PropTypes.object.isRequired,
    "dispatch": PropTypes.func.isRequired,
    "searchKeyword": PropTypes.string,
    "currentTab": PropTypes.string.isRequired
};

export default connect(mapToStore)(ConfiguredSources);
